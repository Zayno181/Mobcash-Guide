#!/usr/bin/env python3
"""PDF Generator for MobCash Guide.

This module generates PDF documents from HTML files using weasyprint.

Example:
    python generate_pdf.py --input _site/index.html --output guide.pdf
"""

import argparse
import logging
import sys
from pathlib import Path
from typing import Optional

from weasyprint import HTML, CSS


class LoggingConfig:
    """Manages logging configuration for the application."""
    
    @staticmethod
    def setup(verbose: bool = False) -> logging.Logger:
        """Configure logging with appropriate level.
        
        Args:
            verbose: Enable debug level logging if True.
            
        Returns:
            Configured logger instance.
        """
        level = logging.DEBUG if verbose else logging.INFO
        logging.basicConfig(
            level=level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        return logging.getLogger(__name__)


class PDFGenerator:
    """Generates PDF files from HTML sources with optional CSS styling.
    
    Attributes:
        base_dir: Base directory for resolving relative paths.
    """
    __slots__ = ('base_dir',)

    def __init__(self, base_dir: Optional[str] = None) -> None:
        """Initialize the PDF generator.

        Args:
            base_dir: Base directory for file paths. Defaults to script's directory.
        """
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent.resolve()

    def generate(
        self,
        html_path: str,
        output_path: str,
        css_path: Optional[str] = None
    ) -> bool:
        """Generate a PDF from an HTML file.

        Args:
            html_path: Path to the input HTML file (relative to base_dir).
            output_path: Path for the output PDF file (relative to base_dir).
            css_path: Optional path to a CSS stylesheet (relative to base_dir).

        Returns:
            True if generation was successful, False otherwise.
            
        Raises:
            FileNotFoundError: If the HTML file does not exist.
        """
        try:
            html_file = self.base_dir / html_path
            output_file = self.base_dir / output_path

            if not html_file.exists():
                logging.error(f"HTML file not found at {html_file}")
                raise FileNotFoundError(f"HTML file not found: {html_file}")

            logging.info(f"Loading HTML from {html_file}")
            
            # Pre-validate output directory exists
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            html = HTML(filename=str(html_file))
            stylesheets = self._load_stylesheets(css_path)

            logging.info(f"Generating PDF at {output_file}")
            html.write_pdf(str(output_file), stylesheets=stylesheets)
            logging.info(f"PDF generated successfully at {output_file}")
            return True

        except FileNotFoundError:
            raise
        except Exception as e:
            logging.error(f"PDF generation failed: {e}", exc_info=True)
            return False
    
    def _load_stylesheets(self, css_path: Optional[str]) -> list[CSS]:
        """Load CSS stylesheets if provided.
        
        Args:
            css_path: Optional path to CSS file.
            
        Returns:
            List of CSS objects.
        """
        if not css_path:
            return []
        
        css_file = self.base_dir / css_path
        if css_file.exists():
            logging.info(f"Applying CSS from {css_file}")
            return [CSS(filename=str(css_file))]
        else:
            logging.warning(f"CSS file not found at {css_file}. Proceeding without it.")
            return []


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments.
    
    Returns:
        Parsed arguments namespace.
    """
    parser = argparse.ArgumentParser(
        description='Generate PDF from HTML files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_pdf.py
  python generate_pdf.py --input index.html --output guide.pdf
  python generate_pdf.py --input page.html --output page.pdf --css styles.css
        """
    )
    
    parser.add_argument(
        '-i', '--input',
        type=str,
        default='_site/index.html',
        help='Input HTML file path (default: _site/index.html)'
    )
    
    parser.add_argument(
        '-o', '--output',
        type=str,
        default='Mobcash_Guide.pdf',
        help='Output PDF file path (default: Mobcash_Guide.pdf)'
    )
    
    parser.add_argument(
        '-c', '--css',
        type=str,
        default='styles.css',
        help='CSS stylesheet path (default: styles.css)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    return parser.parse_args()


def main() -> int:
    """Main entry point for PDF generation.
    
    Returns:
        Exit code (0 for success, 1 for failure).
    """
    args = parse_arguments()
    
    # Setup logging with verbose option
    LoggingConfig.setup(verbose=args.verbose)
    
    generator = PDFGenerator()
    
    try:
        success = generator.generate(
            html_path=args.input,
            output_path=args.output,
            css_path=args.css
        )
        return 0 if success else 1
    except FileNotFoundError as e:
        logging.error(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
