import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-indigo-600">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
            <p className="mt-2 text-base text-gray-500">
              Sorry, we couldn't find the page you're looking for.
            </p>
            <div className="mt-6">
              <Link to="/dashboard">
                <Button variant="primary" icon={<ArrowLeftIcon className="w-5 h-5 mr-2" />}>
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
