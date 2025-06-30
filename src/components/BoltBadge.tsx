import React from 'react';

interface BoltBadgeProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
}

const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  position = 'top-right',
  size = 'medium'
}) => {
  // Determine position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Determine size classes
  const sizeClasses = {
    'small': 'w-12 h-12',
    'medium': 'w-16 h-16',
    'large': 'w-20 h-20'
  };

  return (
    <a 
      href="https://bolt.new/" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`fixed ${positionClasses[position]} z-50 transition-transform hover:scale-110`}
      aria-label="Powered by Bolt.new"
    >
      <div className={`${sizeClasses[size]} rounded-full bg-white flex items-center justify-center shadow-lg`}>
        <img 
          src="/WhatsApp Image 2025-07-01 at 00.05.30.jpeg" 
          alt="Powered by Bolt.new" 
          className="w-full h-full rounded-full"
        />
      </div>
    </a>
  );
};

export default BoltBadge;