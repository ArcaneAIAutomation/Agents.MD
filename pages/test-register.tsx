/**
 * Test Registration Page
 * Direct registration without AccessGate for testing
 */

import { useState } from 'react';
import Head from 'next/head';

export default function TestRegister() {
  const [formData, setFormData] = useState({
    accessCode: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      setResult({
        status: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Head>
        <title>Test Registration - Bitcoin Sovereign Technology</title>
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000', 
        color: '#FFFFFF',
        padding: '2rem',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#F7931A', marginBottom: '2rem' }}>
            Test Registration Page
          </h1>
          
          <form onSubmit={handleSubmit} style={{ 
            background: '#000000',
            border: '1px solid #F7931A',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Access Code
              </label>
              <input
                type="text"
                name="accessCode"
                value={formData.accessCode}
                onChange={handleChange}
                placeholder="BTC-SOVEREIGN-AKCJRG-02"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#000000',
                  border: '2px solid rgba(247,147,26,0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#000000',
                  border: '2px solid rgba(247,147,26,0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#000000',
                  border: '2px solid rgba(247,147,26,0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#000000',
                  border: '2px solid rgba(247,147,26,0.3)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#F7931A',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          {result && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: '#000000',
              border: `2px solid ${result.status === 200 || result.status === 201 ? '#F7931A' : '#FF0000'}`,
              borderRadius: '12px'
            }}>
              <h3 style={{ color: '#F7931A', marginBottom: '1rem' }}>
                Response (Status: {result.status})
              </h3>
              <pre style={{ 
                color: 'rgba(255,255,255,0.8)',
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}

          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(247,147,26,0.1)',
            border: '1px solid rgba(247,147,26,0.3)',
            borderRadius: '8px'
          }}>
            <h4 style={{ color: '#F7931A', marginBottom: '0.5rem' }}>Available Access Codes:</h4>
            <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
              <li>BTC-SOVEREIGN-AKCJRG-02</li>
              <li>BTC-SOVEREIGN-LMBLRN-03</li>
              <li>BTC-SOVEREIGN-HZKEI2-04</li>
              <li>BTC-SOVEREIGN-WVL0HN-05</li>
              <li>BTC-SOVEREIGN-48YDHG-06</li>
              <li>BTC-SOVEREIGN-6HSNX0-07</li>
              <li>BTC-SOVEREIGN-N99A5R-08</li>
              <li>BTC-SOVEREIGN-DCO2DG-09</li>
              <li>BTC-SOVEREIGN-BYE9UX-10</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
