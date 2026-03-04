import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from './button';
export function Pagination({ className, ...props }) { return <nav role='navigation' aria-label='pagination' className={cn('mx-auto flex w-full justify-center', className)} {...props} />; }
export function PaginationContent({ className, ...props }) { return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />; }
export function PaginationItem({ ...props }) { return <li {...props} />; }
export function PaginationLink({ className, isActive, size = 'icon', ...props }) { return <a aria-current={isActive ? 'page' : undefined} className={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }), className)} {...props} />; }
export function PaginationPrevious({ className, ...props }) { return <PaginationLink aria-label='Go to previous page' size='default' className={cn('gap-1 pl-2.5', className)} {...props}><ChevronLeft className='h-4 w-4' /><span>Previous</span></PaginationLink>; }
export function PaginationNext({ className, ...props }) { return <PaginationLink aria-label='Go to next page' size='default' className={cn('gap-1 pr-2.5', className)} {...props}><span>Next</span><ChevronRight className='h-4 w-4' /></PaginationLink>; }
