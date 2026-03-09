export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-logo">
          <svg
            width="22"
            height="22"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#0c0c0c" />
            <path
              d="M8 22V10h3.2v4.8h.1L14.8 10H18l-4 5.2L18.4 22H15l-2.8-5.2-.8 1V22H8Z"
              fill="#fff"
            />
          </svg>
          Gearu
        </div>

        <div className="footer-links">
          <a
            href="https://github.com/eliabejr/gearu"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@gearu/core"
            target="_blank"
            rel="noopener noreferrer"
          >
            npm
          </a>
          <a
            href="https://github.com/eliabejr/gearu#readme"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <a
            href="https://github.com/eliabejr/gearu/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Issues
          </a>
        </div>

        <span className="footer-copy">
          &copy; {new Date().getFullYear()} Gearu. Open-source under MIT.
        </span>
      </div>
    </footer>
  );
}
