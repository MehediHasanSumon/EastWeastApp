import React from 'react';
import { Link } from 'react-router';

interface CardProps {
    title: string;
    description: string;
    href: string;
}

const Card: React.FC<CardProps> = ({
    title,
    description,
    href
}) => {
    return (
        <Link
            to={href}
            className="block max-w-sm p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
        >
            <h3 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
            </h3>
            <p className="font-normal text-gray-700 dark:text-gray-400">
                {description}
            </p>
            <div className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 group-hover:underline">
                Manage Setting
                <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                </svg>
            </div>
        </Link>
    );
};

export default Card;