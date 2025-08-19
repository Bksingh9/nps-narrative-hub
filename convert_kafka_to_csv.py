#!/usr/bin/env python3

import json
import csv
import re
from datetime import datetime

def parse_sse_to_messages(file_path):
    """Parse SSE format file and extract message data"""
    messages = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by lines and look for data: prefixed lines
    lines = content.split('\n')
    
    for line in lines:
        if line.startswith('data:'):
            # Remove 'data:' prefix
            json_str = line[5:].strip()
            if json_str:
                try:
                    data = json.loads(json_str)
                    # Only process MESSAGE type events
                    if data.get('type') == 'MESSAGE' and data.get('message'):
                        message = data['message']
                        
                        # Parse the nested content JSON
                        content_data = {}
                        if 'content' in message:
                            try:
                                content_data = json.loads(message['content'])
                            except:
                                content_data = {'raw_content': message['content']}
                        
                        # Extract key fields from the message
                        record = {
                            'partition': message.get('partition', ''),
                            'offset': message.get('offset', ''),
                            'timestamp': message.get('timestamp', ''),
                            'key': message.get('key', ''),
                            'keySize': message.get('keySize', ''),
                            'valueSize': message.get('valueSize', ''),
                        }
                        
                        # Extract fields from the payload if it exists
                        if 'payload' in content_data:
                            payload = content_data['payload']
                            record.update({
                                'order_id': payload.get('order_id', ''),
                                'user_id': payload.get('user_id', ''),
                                'amount': payload.get('amount', ''),
                                'currency': payload.get('currency', ''),
                                'payment_status': payload.get('payment_status', ''),
                                'method': payload.get('method', ''),
                                'aggregator': payload.get('aggregator', ''),
                                'company_id': payload.get('company_id', ''),
                                'app_id': payload.get('app_id', ''),
                                'customer_email': payload.get('customer_email', ''),
                                'customer_phone': payload.get('customer_phone', ''),
                                'merchant_order_id': payload.get('merchant_order_id', ''),
                                'merchant_transaction_id': payload.get('merchant_transaction_id', ''),
                                'order_platform': payload.get('order_platform', ''),
                                'device': payload.get('device', ''),
                                'source': payload.get('source', ''),
                            })
                            
                            # Extract user details if present
                            if 'user' in payload:
                                user = payload['user']
                                record['user_email'] = user.get('email', '')
                                record['user_mobile'] = user.get('mobile', '')
                                record['user_name'] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                        
                        # Extract meta information
                        if 'meta' in content_data:
                            meta = content_data['meta']
                            record['job_type'] = meta.get('job_type', '')
                            record['action'] = meta.get('action', '')
                            record['meta_timestamp'] = meta.get('timestamp', '')
                        
                        messages.append(record)
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON: {e}")
                    continue
                except Exception as e:
                    print(f"Error processing message: {e}")
                    continue
    
    return messages

def write_to_csv(messages, output_file):
    """Write messages to CSV file"""
    if not messages:
        print("No messages to write")
        return
    
    # Get all unique keys from all messages
    all_keys = set()
    for msg in messages:
        all_keys.update(msg.keys())
    
    # Sort keys for consistent column order
    fieldnames = sorted(list(all_keys))
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(messages)
    
    print(f"✅ Successfully wrote {len(messages)} messages to {output_file}")
    print(f"📊 Columns: {', '.join(fieldnames[:10])}{'...' if len(fieldnames) > 10 else ''}")

def main():
    input_file = 'filtered.json'
    output_file = 'kafka_messages.csv'
    
    print(f"📖 Reading from {input_file}...")
    messages = parse_sse_to_messages(input_file)
    
    print(f"🔍 Found {len(messages)} Kafka messages")
    
    if messages:
        print(f"📝 Writing to {output_file}...")
        write_to_csv(messages, output_file)
        
        # Show sample data
        print("\n📋 Sample data (first message):")
        if messages:
            sample = messages[0]
            for key, value in list(sample.items())[:5]:
                print(f"  {key}: {value}")
    else:
        print("❌ No messages found in the file")

if __name__ == "__main__":
    main() 