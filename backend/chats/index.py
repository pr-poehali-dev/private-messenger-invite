"""
API для работы с чатами и сообщениями
"""
import os
import json
import psycopg2
import jwt
from datetime import datetime
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
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            action = query_params.get('action', 'list_chats')
            
            if action == 'list_chats':
                cursor.execute("""
                    SELECT 
                        c.id,
                        c.type,
                        c.created_at,
                        json_agg(
                            json_build_object(
                                'id', u.id,
                                'username', u.username,
                                'displayName', u.display_name,
                                'isAdmin', u.is_admin
                            )
                        ) as participants,
                        (
                            SELECT json_build_object(
                                'id', m.id,
                                'body', m.body,
                                'senderId', m.sender_id,
                                'createdAt', m.created_at
                            )
                            FROM messages m
                            WHERE m.chat_id = c.id
                            ORDER BY m.created_at DESC
                            LIMIT 1
                        ) as last_message,
                        (
                            SELECT COUNT(*)
                            FROM messages m
                            WHERE m.chat_id = c.id 
                            AND m.sender_id != %s
                            AND m.read_at IS NULL
                        ) as unread_count
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    JOIN users u ON cm.user_id = u.id
                    WHERE c.id IN (
                        SELECT chat_id FROM chat_members WHERE user_id = %s
                    )
                    GROUP BY c.id
                    ORDER BY c.created_at DESC
                """, (user_id, user_id))
                
                chats = cursor.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'chats': [
                            {
                                'id': str(chat['id']),
                                'type': chat['type'],
                                'participants': chat['participants'],
                                'lastMessage': chat['last_message'],
                                'unreadCount': chat['unread_count'],
                                'createdAt': chat['created_at'].isoformat()
                            }
                            for chat in chats
                        ]
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'messages':
                chat_id = query_params.get('chatId')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chatId обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT user_id FROM chat_members WHERE chat_id = %s AND user_id = %s",
                    (chat_id, user_id)
                )
                
                if not cursor.fetchone():
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нет доступа к этому чату'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT 
                        m.id,
                        m.body,
                        m.sender_id,
                        m.created_at,
                        m.read_at
                    FROM messages m
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (chat_id,))
                
                messages = cursor.fetchall()
                
                cursor.execute(
                    "UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE chat_id = %s AND sender_id != %s AND read_at IS NULL",
                    (chat_id, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [
                            {
                                'id': str(msg['id']),
                                'body': msg['body'],
                                'senderId': str(msg['sender_id']),
                                'createdAt': msg['created_at'].isoformat(),
                                'status': 'read' if msg['read_at'] else 'sent'
                            }
                            for msg in messages
                        ]
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_chat':
                other_user_id = body.get('userId')
                
                if not other_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT c.id 
                    FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id
                    JOIN chat_members cm2 ON c.id = cm2.chat_id
                    WHERE cm1.user_id = %s AND cm2.user_id = %s
                    AND c.type = 'direct'
                    LIMIT 1
                """, (user_id, other_user_id))
                
                existing_chat = cursor.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'chatId': str(existing_chat['id'])}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "INSERT INTO chats (type) VALUES ('direct') RETURNING id"
                )
                chat = cursor.fetchone()
                chat_id = chat['id']
                
                cursor.execute(
                    "INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                    (chat_id, user_id, chat_id, other_user_id)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chatId': str(chat_id)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_message':
                chat_id = body.get('chatId')
                message_body = body.get('body', '').strip()
                
                if not chat_id or not message_body:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chatId и body обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT user_id FROM chat_members WHERE chat_id = %s AND user_id = %s",
                    (chat_id, user_id)
                )
                
                if not cursor.fetchone():
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нет доступа к этому чату'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "INSERT INTO messages (chat_id, sender_id, body) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (chat_id, user_id, message_body)
                )
                message = cursor.fetchone()
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': {
                            'id': str(message['id']),
                            'chatId': chat_id,
                            'senderId': user_id,
                            'body': message_body,
                            'createdAt': message['created_at'].isoformat(),
                            'status': 'sent'
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
