class Pagination:
    """Helper class for pagination"""
    
    def __init__(self, page=1, per_page=10):
        self.page = max(1, page)
        self.per_page = max(1, min(per_page, 100))
    
    def get_offset(self):
        """Get the offset for database queries"""
        return (self.page - 1) * self.per_page
    
    def paginate_query(self, query):
        """Apply pagination to a SQLAlchemy query"""
        total = query.count()
        items = query.limit(self.per_page).offset(self.get_offset()).all()
        
        return {
            'items': items,
            'total': total,
            'page': self.page,
            'per_page': self.per_page,
            'pages': (total + self.per_page - 1) // self.per_page
        }
    
    @staticmethod
    def serialize_pagination(query_result, serializer=None):
        """Serialize pagination result"""
        return {
            'data': [serializer(item) if serializer else item for item in query_result['items']],
            'pagination': {
                'page': query_result['page'],
                'per_page': query_result['per_page'],
                'total': query_result['total'],
                'pages': query_result['pages']
            }
        }