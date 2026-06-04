import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  as = 'button',
  href,
  target,
  rel,
  ...rest 
}) => {
  const Component = as === 'a' ? 'a' : 'button';
  
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    icon && !children && 'btn-icon-only',
    className
  ].filter(Boolean).join(' ');

  const buttonProps = {
    className: buttonClasses,
    onClick: disabled || loading ? undefined : onClick,
    disabled: disabled || loading,
    ...(Component === 'button' ? { type } : {}),
    ...(Component === 'a' ? { href, target, rel: target === '_blank' ? 'noopener noreferrer' : rel } : {}),
    ...rest
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <span className="btn-loader">
          <Loader2 size={18} className="spinner" />
        </span>
      );
    }
    if (icon) {
      return <span className="btn-icon">{icon}</span>;
    }
    return null;
  };

  return (
    <Component {...buttonProps}>
      {iconPosition === 'left' && renderIcon()}
      {children && <span className="btn-content">{children}</span>}
      {iconPosition === 'right' && !loading && renderIcon()}
    </Component>
  );
};

export default Button;