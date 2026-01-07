"""
Инициализация проекта: создание первого инвайта если пользователей нет
"""
import os
import json
import psycopg2
import secrets
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')


def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def generate_invite_token():
    return secrets.token_urlsafe(16)


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            cursor.execute("SELECT COUNT(*) as count FROM users")
            user_count = cursor.fetchone()['count']
            
            if user_count > 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователи уже существуют'}),
                    'isBase64Encoded': False
                }
            
            token = generate_invite_token()
            expires_at = datetime.utcnow() + timedelta(days=30)
            
            cursor.execute(
                "INSERT INTO invites (token, expires_at, max_uses, created_by_user_id) VALUES (%s, %s, %s, NULL) RETURNING id, token, expires_at",
                (token, expires_at, 1)
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
                        'expiresAt': invite['expires_at'].isoformat(),
                        'inviteUrl': f"/auth?invite={token}"
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            cursor.execute("SELECT COUNT(*) as count FROM users")
            user_count = cursor.fetchone()['count']
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'initialized': user_count > 0,
                    'userCount': user_count
                }),
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
