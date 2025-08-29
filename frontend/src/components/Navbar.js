import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between">
            <h1 className="font-bold">Betwin</h1>
            <div className="space-x-4">
                <Link to="/deposit">Deposit</Link>
                <Link to="/withdraw">Withdraw</Link>
            </div>
        </nav>
    );
}
