# MobCash Guide - Development Setup

## Prerequisites

- Node.js 18+ 
- Python 3.9+
- pip (Python package manager)

## Installation

### JavaScript Dependencies

```bash
npm install
```

### Python Dependencies

```bash
pip install -r requirements.txt
```

## Development Commands

### Build the Site

```bash
npm run build
```

### Start Development Server

```bash
npm start
```

### Generate PDF

```bash
python generate_pdf.py
```

With custom options:

```bash
python generate_pdf.py --input _site/index.html --output guide.pdf --css styles.css
python generate_pdf.py -v  # verbose mode
```

### Run Linters

```bash
# JavaScript linting
npx eslint script.js

# CSS linting (if stylelint is installed)
npx stylelint styles.css

# Python type checking
mypy generate_pdf.py
```

### Run Tests

```bash
# Python tests
pytest

# JavaScript tests (when implemented)
npm test
```

## Project Structure

```
/workspace
├── src/                    # Source files for 11ty
│   ├── _includes/         # Layout templates
│   ├── assets/            # Static assets
│   └── *.md               # Markdown content files
├── _site/                 # Generated site output
├── script.js              # Main JavaScript file
├── styles.css             # Main stylesheet
├── generate_pdf.py        # PDF generation script
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies
├── .eslintrc.json        # ESLint configuration
└── .prettierrc.json      # Prettier configuration
```

## Code Quality

This project uses:

- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **pytest** for Python testing
- **mypy** for Python type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linters
5. Submit a pull request

## License

ISC
