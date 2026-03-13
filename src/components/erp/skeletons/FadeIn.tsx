import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

const FadeIn = ({ children, className = '' }: Props) => (
  <div className={`animate-in fade-in duration-500 ${className}`}>
    {children}
  </div>
);

export default FadeIn;
