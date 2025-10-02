# Contributing to SoundDocs

First off, thank you for considering contributing to SoundDocs! It's people like you that make SoundDocs such a great tool. We welcome any form of contribution, from reporting bugs and suggesting features to writing code and improving documentation.

## 🤖 AI-Assisted Development (Recommended)

If you're using AI-assisted coding tools or "vibe coding" approaches, we **strongly recommend using [Claude Code](https://claude.ai/claude-code)** for the best development experience.

### Why Claude Code for SoundDocs?

This project is specifically optimized for Claude Code with:

- **[.claude/CLAUDE.md](.claude/CLAUDE.md)**: Comprehensive project documentation covering:

  - Complete architecture overview
  - Tech stack details (React, TypeScript, Supabase, pnpm)
  - Code style conventions and patterns
  - Database schema and security policies
  - Common tasks and workflows
  - Troubleshooting guides

- **60+ Specialized Sub-Agents**: Claude Code provides expert agents for:

  - Frontend development (React, TypeScript)
  - Backend & database (Supabase, PostgreSQL)
  - Testing & QA
  - Security & performance
  - DevOps & CI/CD
  - Documentation
  - And many more...

- **Intelligent Delegation**: Claude Code acts as a CTO, delegating tasks to the most appropriate specialist agent for better results and faster development.

Using Claude Code means you'll automatically follow project conventions, use the right patterns, and produce higher-quality code that aligns with our architecture.

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
7.  **Provide a clear title** for your pull request. Qodo will automatically generate a description, code review, and suggestions based on your changes.

### Code Reviews with Qodo

This repository uses **Qodo** for automated code reviews and PR management:

- **Automatic PR Descriptions**: Qodo analyzes your code changes and generates comprehensive PR descriptions automatically
- **AI-Powered Code Reviews**: Qodo provides intelligent code review comments focusing on:
  - Code quality and best practices
  - Potential bugs and security issues
  - Performance optimizations
  - Documentation improvements
- **PR Suggestions**: Qodo offers actionable suggestions to improve your code
- **Review Management**: Qodo helps manage the review process and ensures code standards are maintained

**Note**: Since Qodo handles PR descriptions automatically, you only need to provide a clear, descriptive title for your pull requests.

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
