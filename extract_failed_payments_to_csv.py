#!/usr/bin/env python3

import json
import csv
from datetime import datetime

def parse_sse_to_detailed_messages(file_path):
    """Parse SSE format file and extract detailed message data"""
    all_messages = []
    failed_messages = []
    
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
                        
                        # Extract comprehensive fields from the message
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
                            
                            # Core payment fields
                            record.update({
                                'order_id': payload.get('order_id', ''),
                                'merchant_order_id': payload.get('merchant_order_id', ''),
                                'merchant_transaction_id': payload.get('merchant_transaction_id', ''),
                                'user_id': payload.get('user_id', ''),
                                'customer_id': payload.get('customer_id', ''),
                                'amount': payload.get('amount', ''),
                                'total_amount': payload.get('total_amount', ''),
                                'cart_value': payload.get('cart_value', ''),
                                'currency': payload.get('currency', ''),
                                'payment_status': payload.get('payment_status', ''),
                                'method': payload.get('method', ''),
                                'payment_mode': payload.get('payment_mode', ''),
                                'payment_identifier': payload.get('payment_identifier', ''),
                                'aggregator': payload.get('aggregator', ''),
                                'aggregator_id': payload.get('aggregator_id', ''),
                                'company_id': payload.get('company_id', ''),
                                'app_id': payload.get('app_id', ''),
                                'customer_email': payload.get('customer_email', ''),
                                'customer_phone': payload.get('customer_phone', ''),
                                'order_platform': payload.get('order_platform', ''),
                                'device': payload.get('device', ''),
                                'source': payload.get('source', ''),
                                'profile': payload.get('profile', ''),
                                'mode': payload.get('mode', ''),  # live/test
                                'is_extension_order': payload.get('is_extension_order', ''),
                                'order_type': payload.get('order_type', ''),
                            })
                            
                            # Extract cart information if present
                            if 'cart' in payload:
                                cart = payload['cart']
                                record['cart_id'] = cart.get('uid', '')
                                record['cart_items_count'] = len(cart.get('articles', []))
                                record['cart_created_on'] = cart.get('created_on', '')
                                record['cart_last_modified'] = cart.get('last_modified', '')
                                record['total_quantity'] = cart.get('total_quantity', '')
                                record['delivery_charges'] = cart.get('delivery_charges', '')
                                record['cod_charges'] = cart.get('cod_charges', '')
                                record['coupon_value'] = cart.get('coupon_value', '')
                                record['cashback_applied'] = cart.get('cashback_applied', '')
                            
                            # Extract user details if present
                            if 'user' in payload:
                                user = payload['user']
                                record['user_email'] = user.get('email', '')
                                record['user_mobile'] = user.get('mobile', '')
                                record['user_first_name'] = user.get('first_name', '')
                                record['user_last_name'] = user.get('last_name', '')
                                record['user_type'] = user.get('user_type', '')
                                record['is_authenticated'] = user.get('is_authenticated', '')
                            
                            # Extract billing address if present
                            if 'billing_address' in payload:
                                billing = payload['billing_address']
                                record['billing_city'] = billing.get('city', '')
                                record['billing_state'] = billing.get('state', '')
                                record['billing_pincode'] = billing.get('pincode', '')
                                record['billing_country'] = billing.get('country', '')
                            
                            # Extract delivery address if present
                            if 'delivery_address' in payload:
                                delivery = payload['delivery_address']
                                record['delivery_city'] = delivery.get('city', '')
                                record['delivery_state'] = delivery.get('state', '')
                                record['delivery_pincode'] = delivery.get('pincode', '')
                                record['delivery_country'] = delivery.get('country', '')
                            
                            # Extract payment methods details
                            if 'payment_methods' in payload and payload['payment_methods']:
                                payment_method = payload['payment_methods'][0] if isinstance(payload['payment_methods'], list) else payload['payment_methods']
                                record['payment_method_name'] = payment_method.get('name', '')
                                record['payment_method_mode'] = payment_method.get('mode', '')
                                record['payment_method_amount'] = payment_method.get('amount', '')
                                
                                # Extract transaction data if present
                                if 'transaction_data' in payment_method:
                                    trans_data = payment_method['transaction_data']
                                    record['transaction_id'] = trans_data.get('id', '')
                                    record['transaction_status'] = trans_data.get('status', '')
                                    record['payment_id'] = trans_data.get('payment_id', '')
                            
                            # Gringotts response data
                            if 'gringotts_response' in payload:
                                gringotts = payload['gringotts_response']
                                record['gringotts_success'] = gringotts.get('success', '')
                                record['gringotts_message'] = gringotts.get('message', '')
                                record['gringotts_status'] = gringotts.get('status', '')
                                record['gringotts_id'] = gringotts.get('id', '')
                        
                        # Extract meta information
                        if 'meta' in content_data:
                            meta = content_data['meta']
                            record['job_type'] = meta.get('job_type', '')
                            record['action'] = meta.get('action', '')
                            record['meta_timestamp'] = meta.get('timestamp', '')
                            record['trace'] = meta.get('trace', '')
                        
                        # Add to all messages list
                        all_messages.append(record)
                        
                        # Check if it's a failed payment and add to failed list
                        if (record.get('payment_status') == 'failed' or 
                            record.get('action') == 'payment_failed' or
                            record.get('gringotts_status') == 'failed' or
                            record.get('transaction_status') == 'failed'):
                            failed_messages.append(record)
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON: {e}")
                    continue
                except Exception as e:
                    print(f"Error processing message: {e}")
                    continue
    
    return all_messages, failed_messages

def write_to_csv(messages, output_file, description=""):
    """Write messages to CSV file"""
    if not messages:
        print(f"No {description} messages to write")
        return
    
    # Get all unique keys from all messages
    all_keys = set()
    for msg in messages:
        all_keys.update(msg.keys())
    
    # Sort keys for consistent column order
    # Put important fields first
    priority_fields = ['order_id', 'payment_status', 'action', 'amount', 'customer_email', 
                      'timestamp', 'merchant_order_id', 'user_id', 'transaction_status']
    other_fields = sorted([k for k in all_keys if k not in priority_fields])
    fieldnames = [f for f in priority_fields if f in all_keys] + other_fields
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(messages)
    
    print(f"✅ Successfully wrote {len(messages)} {description} messages to {output_file}")
    print(f"📊 Key columns: {', '.join(fieldnames[:10])}{'...' if len(fieldnames) > 10 else ''}")

def main():
    input_file = 'filtered.json'
    all_output_file = 'all_kafka_payment_messages.csv'
    failed_output_file = 'failed_payment_messages.csv'
    
    print(f"📖 Reading from {input_file}...")
    all_messages, failed_messages = parse_sse_to_detailed_messages(input_file)
    
    print(f"\n📊 Statistics:")
    print(f"   Total messages found: {len(all_messages)}")
    print(f"   Failed payment messages: {len(failed_messages)}")
    
    if all_messages:
        print(f"\n📝 Writing ALL messages to {all_output_file}...")
        write_to_csv(all_messages, all_output_file, "payment")
        
        # Show sample data
        print("\n📋 Sample ALL data (first message):")
        sample = all_messages[0]
        for key in ['order_id', 'payment_status', 'amount', 'customer_email', 'action']:
            if key in sample:
                print(f"  {key}: {sample[key]}")
    
    if failed_messages:
        print(f"\n📝 Writing FAILED messages to {failed_output_file}...")
        write_to_csv(failed_messages, failed_output_file, "failed payment")
        
        # Show sample failed data
        print("\n⚠️ Sample FAILED payment data (first message):")
        sample = failed_messages[0]
        for key in ['order_id', 'payment_status', 'amount', 'customer_email', 'gringotts_message']:
            if key in sample:
                print(f"  {key}: {sample[key]}")
    else:
        print("\n❌ No failed payment messages found in the data")
    
    # Print summary
    if all_messages:
        success_count = len(all_messages) - len(failed_messages)
        print(f"\n📈 Summary:")
        print(f"   Success rate: {(success_count / len(all_messages) * 100):.1f}%")
        print(f"   Failure rate: {(len(failed_messages) / len(all_messages) * 100):.1f}%")

if __name__ == "__main__":
    main() 