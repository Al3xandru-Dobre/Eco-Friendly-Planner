import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Primitives';

export function NotFound() {
  return (
    <div className="container page">
      <EmptyState title="That page does not exist" action={<Link to="/" className="btn btn-primary">Back home</Link>}>Check the address, or start from the home page.</EmptyState>
    </div>
  );
}
