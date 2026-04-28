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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PDFGenerator:
    """Generates PDF files from HTML sources with optional CSS styling.
    
    Attributes:
        base_dir: Base directory for resolving relative paths.
    """

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
                logger.error(f"HTML file not found at {html_file}")
                raise FileNotFoundError(f"HTML file not found: {html_file}")

            logger.info(f"Loading HTML from {html_file}")
            html = HTML(filename=str(html_file))
            stylesheets = []

            if css_path:
                css_file = self.base_dir / css_path
                if css_file.exists():
                    logger.info(f"Applying CSS from {css_file}")
                    stylesheets.append(CSS(filename=str(css_file)))
                else:
                    logger.warning(f"CSS file not found at {css_file}. Proceeding without it.")

            logger.info(f"Generating PDF at {output_file}")
            html.write_pdf(str(output_file), stylesheets=stylesheets)
            logger.info(f"PDF generated successfully at {output_file}")
            return True

        except FileNotFoundError:
            raise
        except Exception as e:
            logger.error(f"PDF generation failed: {e}", exc_info=True)
            return False


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
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    generator = PDFGenerator()
    
    success = generator.generate(
        html_path=args.input,
        output_path=args.output,
        css_path=args.css
    )
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
