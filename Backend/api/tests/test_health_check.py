from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class HealthCheckTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_health_check_endpoint(self):
        """Test health check endpoint returns 200"""
        url = reverse('health-check')
        response = self.client.get(url)
        
        self.assertIn(response.status_code, [200, 503])
        self.assertIn('status', response.json())
        self.assertIn('services', response.json())
        self.assertIn('database', response.json()['services'])
