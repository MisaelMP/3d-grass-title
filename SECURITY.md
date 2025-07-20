# Security Policy

## Supported Versions

We actively support the following versions of this project:

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing [misaelmdev@gmail.com](mailto:misaelmdev@gmail.com) or opening a security advisory on GitHub.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Possible impact of the vulnerability
- Any suggested fixes (if you have them)

### Response timeline:

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix & Release**: Depends on severity (24 hours for critical, 1-2 weeks for others)

## Security Best Practices for Users

When using this package:

1. **Keep dependencies updated**: Regularly update to the latest version
2. **Validate inputs**: Always validate any user inputs passed to component properties
3. **Content Security Policy**: Consider CSP headers when using WebGL content
4. **HTTPS only**: Use this component only over HTTPS in production
5. **Sanitize URLs**: If using the `link` property, ensure URLs are properly validated

## Known Security Considerations

- This component renders WebGL content - ensure your CSP allows WebGL
- Font URLs are loaded from external sources - validate font URLs in production
- The component creates canvas elements - ensure proper CSP for canvas
