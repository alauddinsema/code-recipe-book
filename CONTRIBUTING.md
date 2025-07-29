# 🤝 Contributing to Code Recipe Book

Thank you for your interest in contributing to Code Recipe Book! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A Supabase account (for backend testing)
- A Google AI Studio account (for Gemini API testing)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/code-recipe-book.git
   cd code-recipe-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new files
- **React**: Use functional components with hooks
- **Styling**: Use Tailwind CSS utility classes
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Add comments for complex logic

### File Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── recipe/         # Recipe-related components
│   └── ui/             # Generic UI components
├── pages/              # Page components
├── services/           # API services and data layer
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and constants
└── styles/             # Global styles
```

### Component Guidelines

1. **Functional Components**
   ```tsx
   import React from 'react';
   
   interface ComponentProps {
     title: string;
     optional?: boolean;
   }
   
   const Component: React.FC<ComponentProps> = ({ title, optional = false }) => {
     return <div>{title}</div>;
   };
   
   export default Component;
   ```

2. **Custom Hooks**
   ```tsx
   import { useState, useEffect } from 'react';
   
   export const useCustomHook = (param: string) => {
     const [state, setState] = useState<string>('');
     
     useEffect(() => {
       // Effect logic
     }, [param]);
     
     return { state, setState };
   };
   ```

3. **Service Layer**
   ```tsx
   export class ServiceName {
     static async methodName(param: string): Promise<ReturnType> {
       try {
         // Service logic
         return result;
       } catch (error) {
         console.error('Service error:', error);
         throw error;
       }
     }
   }
   ```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- Browser: [e.g., Chrome 91]
- OS: [e.g., macOS 11.4]
- Node.js: [e.g., 18.0.0]

## Screenshots
If applicable, add screenshots
```

## ✨ Feature Requests

When suggesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## 🔄 Pull Request Process

### Before Submitting

1. **Check existing issues** to avoid duplicates
2. **Create an issue** to discuss major changes
3. **Fork the repository** and create a feature branch
4. **Write tests** for new functionality
5. **Update documentation** if needed

### Pull Request Guidelines

1. **Branch Naming**
   ```
   feature/add-recipe-sharing
   bugfix/fix-login-error
   docs/update-readme
   ```

2. **Commit Messages**
   ```
   feat: add recipe sharing functionality
   fix: resolve login authentication error
   docs: update installation instructions
   style: improve mobile responsive design
   ```

3. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] Added tests for new functionality
   - [ ] Manual testing completed
   
   ## Screenshots
   If applicable, add screenshots
   ```

### Review Process

1. **Automated Checks**: Ensure all CI checks pass
2. **Code Review**: Address reviewer feedback
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Update docs if necessary

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows

### Test Structure

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('should handle user interaction', () => {
    const mockFn = jest.fn();
    render(<Component onClick={mockFn} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Include type definitions for all props and parameters
- Document API endpoints and data structures

### README Updates

When adding features:
- Update feature list
- Add configuration instructions
- Include usage examples

## 🎯 Areas for Contribution

### High Priority

- [ ] Recipe import/export functionality
- [ ] Advanced search and filtering
- [ ] Recipe rating and reviews
- [ ] Social features (following, sharing)
- [ ] Mobile app (React Native)

### Medium Priority

- [ ] Recipe collections/cookbooks
- [ ] Meal planning features
- [ ] Shopping list generation
- [ ] Nutritional information
- [ ] Recipe scaling calculator

### Low Priority

- [ ] Recipe video support
- [ ] Voice commands
- [ ] Offline support
- [ ] Recipe recommendations
- [ ] Integration with smart kitchen devices

## 🆘 Getting Help

- **Discord**: Join our community Discord server
- **Issues**: Create an issue for questions
- **Discussions**: Use GitHub Discussions for general questions
- **Email**: Contact maintainers directly

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special badges for long-term contributors

---

Thank you for contributing to Code Recipe Book! 🍳✨
