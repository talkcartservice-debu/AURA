export function Form({ children, ...props }) { return <form {...props}>{children}</form>; }
export function FormField({ children }) { return <div>{children}</div>; }
export function FormItem({ children, className }) { return <div className={className}>{children}</div>; }
export function FormLabel({ children }) { return <label className='text-sm font-medium'>{children}</label>; }
export function FormControl({ children }) { return <>{children}</>; }
export function FormMessage({ children }) { return children ? <p className='text-sm text-destructive'>{children}</p> : null; }
