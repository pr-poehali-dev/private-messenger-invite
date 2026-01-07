"""
Авторизация и регистрация пользователей с поддержкой JWT токенов и инвайт-системы
"""
import os
import json
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30


def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def create_tokens(user_id: str):
    access_token = jwt.encode(
        {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    refresh_token = jwt.encode(
        {'user_id': user_id, 'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    return access_token, refresh_token


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                username = body.get('username', '').strip().lower()
                display_name = body.get('displayName', '').strip()
                password = body.get('password', '').strip()
                invite_token = body.get('inviteToken', '').strip()
                
                if not username or not display_name or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                if not invite_token:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется инвайт-код'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT * FROM invites WHERE token = %s AND revoked_at IS NULL",
                    (invite_token,)
                )
                invite = cursor.fetchone()
                
                if not invite:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Инвайт недействителен'}),
                        'isBase64Encoded': False
                    }
                
                if invite['expires_at'] < datetime.utcnow():
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Срок действия инвайта истёк'}),
                        'isBase64Encoded': False
                    }
                
                if invite['used_count'] >= invite['max_uses']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Инвайт уже использован'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cursor.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя пользователя уже занято'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                cursor.execute("SELECT COUNT(*) as count FROM users")
                user_count = cursor.fetchone()['count']
                is_admin = (user_count == 0)
                
                cursor.execute(
                    "INSERT INTO users (username, display_name, password_hash, is_admin) VALUES (%s, %s, %s, %s) RETURNING id, username, display_name, is_admin, created_at",
                    (username, display_name, password_hash, is_admin)
                )
                user = cursor.fetchone()
                
                cursor.execute(
                    "UPDATE invites SET used_count = used_count + 1 WHERE id = %s",
                    (invite['id'],)
                )
                
                conn.commit()
                
                access_token, refresh_token = create_tokens(str(user['id']))
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': str(user['id']),
                            'username': user['username'],
                            'displayName': user['display_name'],
                            'isAdmin': user['is_admin'],
                            'createdAt': user['created_at'].isoformat()
                        },
                        'accessToken': access_token,
                        'refreshToken': refresh_token
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                username = body.get('username', '').strip().lower()
                password = body.get('password', '').strip()
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT * FROM users WHERE username = %s",
                    (username,)
                )
                user = cursor.fetchone()
                
                if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверное имя пользователя или пароль'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                conn.commit()
                
                access_token, refresh_token = create_tokens(str(user['id']))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': {
                            'id': str(user['id']),
                            'username': user['username'],
                            'displayName': user['display_name'],
                            'isAdmin': user['is_admin'],
                            'createdAt': user['created_at'].isoformat()
                        },
                        'accessToken': access_token,
                        'refreshToken': refresh_token
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            auth_header = event.get('headers', {}).get('X-Authorization', '')
            if not auth_header.startswith('Bearer '):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не авторизован'}),
                    'isBase64Encoded': False
                }
            
            token = auth_header.replace('Bearer ', '')
            
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload['user_id']
            except jwt.ExpiredSignatureError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен истёк'}),
                    'isBase64Encoded': False
                }
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Невалидный токен'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "SELECT id, username, display_name, is_admin, created_at FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {
                        'id': str(user['id']),
                        'username': user['username'],
                        'displayName': user['display_name'],
                        'isAdmin': user['is_admin'],
                        'createdAt': user['created_at'].isoformat()
                    }
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
