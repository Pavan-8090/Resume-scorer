import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Cookies from 'js-cookie';
import Navbar from '../components/Navbar';
import ResumeAnalyzer from '../components/ResumeAnalyzer';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = Cookies.get('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user`, {
        headers,
      }).catch(() => null);

      if (userResponse) setUser(userResponse.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ResumeAnalyzer />
    </div>
  );
}