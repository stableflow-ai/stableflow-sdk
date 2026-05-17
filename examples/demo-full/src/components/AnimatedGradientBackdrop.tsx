import './AnimatedGradientBackdrop.css';

export function AnimatedGradientBackdrop() {
  return (
    <div className="animated-gradient-backdrop" aria-hidden="true">
      <div className="animated-gradient-backdrop__layer animated-gradient-backdrop__layer--a" />
      <div className="animated-gradient-backdrop__layer animated-gradient-backdrop__layer--b" />
      <div className="animated-gradient-backdrop__layer animated-gradient-backdrop__layer--c" />
    </div>
  );
}
