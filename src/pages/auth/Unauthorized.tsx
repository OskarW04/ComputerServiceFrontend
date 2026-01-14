import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-4">
      <h1 className="text-4xl font-bold text-red-600">403 - Brak Dostępu</h1>
      <p className="text-lg text-gray-700">Nie masz uprawnień do przeglądania tej strony.</p>
      <Button onClick={() => navigate(-1)}>Wróć</Button>
    </div>
  );
}
