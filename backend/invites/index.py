"""
API для управления инвайт-ссылками (только для администраторов)
"""
import os
import json
import psycopg2
import jwt
import secrets
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production')
JWT_ALGORITHM = 'HS256'


def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def verify_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except:
        return None


def generate_invite_token():
    return secrets.token_urlsafe(16)


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    user_id = verify_token(auth_header)
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не авторизован'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or not user['is_admin']:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Только администраторы могут управлять инвайтами'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            cursor.execute("""
                SELECT 
                    i.id,
                    i.token,
                    i.created_at,
                    i.expires_at,
                    i.max_uses,
                    i.used_count,
                    i.revoked_at,
                    json_build_object(
                        'id', u.id,
                        'username', u.username,
                        'displayName', u.display_name
                    ) as created_by
                FROM invites i
                JOIN users u ON i.created_by_user_id = u.id
                ORDER BY i.created_at DESC
            """)
            
            invites = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'invites': [
                        {
                            'id': str(invite['id']),
                            'token': invite['token'],
                            'createdAt': invite['created_at'].isoformat(),
                            'expiresAt': invite['expires_at'].isoformat(),
                            'maxUses': invite['max_uses'],
                            'usedCount': invite['used_count'],
                            'revokedAt': invite['revoked_at'].isoformat() if invite['revoked_at'] else None,
                            'createdBy': invite['created_by']
                        }
                        for invite in invites
                    ]
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            max_uses = body.get('maxUses', 1)
            days_valid = body.get('daysValid', 7)
            
            if max_uses < 1 or days_valid < 1:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'maxUses и daysValid должны быть больше 0'}),
                    'isBase64Encoded': False
                }
            
            token = generate_invite_token()
            expires_at = datetime.utcnow() + timedelta(days=days_valid)
            
            cursor.execute(
                "INSERT INTO invites (token, expires_at, max_uses, created_by_user_id) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (token, expires_at, max_uses, user_id)
            )
            invite = cursor.fetchone()
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'invite': {
                        'id': str(invite['id']),
                        'token': token,
                        'createdAt': invite['created_at'].isoformat(),
                        'expiresAt': expires_at.isoformat(),
                        'maxUses': max_uses,
                        'usedCount': 0
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            invite_id = body.get('inviteId')
            
            if not invite_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'inviteId обязателен'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "UPDATE invites SET revoked_at = CURRENT_TIMESTAMP WHERE id = %s AND revoked_at IS NULL RETURNING id",
                (invite_id,)
            )
            
            result = cursor.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Инвайт не найден или уже отозван'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
