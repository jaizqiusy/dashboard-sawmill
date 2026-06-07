import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const hp = window.location.hostname;
  if (
    hp === 'localhost' || 
    hp === '127.0.0.1' || 
    hp.endsWith('.run.app')
  ) {
    return path;
  }
  const backendHost = 'https://ais-pre-ich54svj2vf33atb7lznme-718003844411.asia-east1.run.app';
  return `${backendHost}${path}`;
}
