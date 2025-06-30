from supabase import create_client, Client
from app.core.config import settings
import asyncio
from typing import Dict, Any, List, Optional
import json

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.admin_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into a table"""
        try:
            result = self.client.table(table).insert(data).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            raise Exception(f"Insert failed: {str(e)}")
    
    async def select(self, table: str, columns: str = "*", filters: Optional[Dict[str, Any]] = None, 
                    order_by: Optional[str] = None, limit: Optional[int] = None, 
                    offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Select data from a table"""
        try:
            query = self.client.table(table).select(columns)
            
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        query = query.in_(key, value)
                    else:
                        query = query.eq(key, value)
            
            if order_by:
                if order_by.startswith('-'):
                    query = query.order(order_by[1:], desc=True)
                else:
                    query = query.order(order_by)
            
            if limit:
                query = query.limit(limit)
            
            if offset:
                query = query.offset(offset)
            
            result = query.execute()
            return result.data or []
        except Exception as e:
            raise Exception(f"Select failed: {str(e)}")
    
    async def update(self, table: str, data: Dict[str, Any], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Update data in a table"""
        try:
            query = self.client.table(table).update(data)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return result.data or []
        except Exception as e:
            raise Exception(f"Update failed: {str(e)}")
    
    async def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Delete data from a table"""
        try:
            query = self.client.table(table).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return result.data or []
        except Exception as e:
            raise Exception(f"Delete failed: {str(e)}")
    
    async def count(self, table: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count rows in a table"""
        try:
            query = self.client.table(table).select("*", count="exact")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            result = query.execute()
            return result.count or 0
        except Exception as e:
            raise Exception(f"Count failed: {str(e)}")
    
    async def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Call a Supabase RPC function"""
        try:
            result = self.client.rpc(function_name, params or {}).execute()
            return result.data
        except Exception as e:
            raise Exception(f"RPC call failed: {str(e)}")

# Global Supabase client instance
supabase_client = SupabaseClient()

# Dependency to get Supabase client
async def get_supabase() -> SupabaseClient:
    return supabase_client