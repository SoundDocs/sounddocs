# Contributing to SoundDocs

First off, thank you for considering contributing to SoundDocs! It's people like you that make SoundDocs such a great tool. We welcome any form of contribution, from reporting bugs and suggesting features to writing code and improving documentation.

## Code of Conduct

This project and everyone participating in it is governed by the [SoundDocs Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please make sure it hasn't already been reported by searching the [GitHub Issues](https://github.com/SoundDocs/sounddocs/issues). If you can't find an open issue addressing the problem, please [open a new one](https://github.com/SoundDocs/sounddocs/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

If you have an idea for a new feature or an enhancement to an existing one, please open an issue to discuss it. This allows us to coordinate our efforts and prevent duplication of work.

### Pull Requests

We love pull requests! Here's a quick guide on how to submit one:

1.  **Fork the repository** and create your branch from `beta`.
2.  **Set up your development environment** by following the instructions in the `README.md`.
3.  **Make your changes**.
4.  **Ensure your code lints**. Run `pnpm lint` to check for any issues.
5.  **Write clear, concise commit messages**. We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
6.  **Push your branch** and open a pull request to the `beta` branch.
7.  **Create a pull request** - CodeRabbit will automatically generate a comprehensive description based on your changes. You only need to provide a clear, concise title for your PR.
8.  **Ensure PR passes all tests** - Pull requests must pass all automated tests and linting checks before they can be merged. Contributors are responsible for fixing any errors or failed tests before their PR is merged.

## CodeRabbit AI Assistant

This repository uses [CodeRabbit](https://coderabbit.ai/) to enhance the pull request process:

### 🤖 **Automated PR Descriptions**

- CodeRabbit automatically analyzes your code changes and generates comprehensive PR descriptions
- No need to write detailed descriptions - just provide a clear title
- AI-generated descriptions include context, impact analysis, and implementation details

### 🔍 **Intelligent Code Reviews**

- CodeRabbit performs automated code reviews on all pull requests
- Identifies potential issues, bugs, and improvement opportunities
- Provides actionable feedback and suggestions for code quality

### 💡 **Smart PR Suggestions**

- Offers intelligent suggestions for code improvements
- Helps maintain consistency across the codebase
- Provides context-aware recommendations based on the existing codebase

### 📝 **How It Works**

1. **You create a PR** with just a clear title
2. **CodeRabbit analyzes** your changes and generates a detailed description
3. **CodeRabbit reviews** your code and provides feedback
4. **You can accept/reject** CodeRabbit's suggestions as needed

This AI-assisted workflow ensures high-quality contributions while reducing the manual effort required for comprehensive PR documentation and reviews.

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Limit the first line to 72 characters or less.
- Reference issues and pull requests liberally after the first line.

### TypeScript Styleguide

- We use Prettier to format our code. Please make sure your editor is configured to use it.
- We use ESLint to catch common errors. Run `pnpm lint` to check your code.

Thank you again for your contribution!
