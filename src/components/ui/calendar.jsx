import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';
function Calendar({ className, classNames, showOutsideDays = true, ...props }) { return <DayPicker showOutsideDays={showOutsideDays} className={cn('p-3', className)} {...props} />; }
Calendar.displayName = 'Calendar';
export { Calendar };
