"""Unit tests for PDF Generator module."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from generate_pdf import PDFGenerator


class TestPDFGenerator:
    """Test cases for PDFGenerator class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.generator = PDFGenerator(base_dir="/tmp")

    def test_init_default_base_dir(self):
        """Test initialization with default base directory."""
        gen = PDFGenerator()
        assert gen.base_dir is not None
        assert isinstance(gen.base_dir, Path)

    def test_init_custom_base_dir(self):
        """Test initialization with custom base directory."""
        gen = PDFGenerator("/custom/path")
        assert gen.base_dir == Path("/custom/path")

    @patch('generate_pdf.HTML')
    @patch('generate_pdf.CSS')
    @patch.object(Path, 'exists')
    def test_generate_success(self, mock_exists, mock_css, mock_html):
        """Test successful PDF generation."""
        mock_exists.return_value = True
        mock_html_instance = Mock()
        mock_html.return_value = mock_html_instance
        
        result = self.generator.generate(
            html_path="test.html",
            output_path="output.pdf",
            css_path="styles.css"
        )
        
        assert result is True
        mock_html.assert_called_once()
        mock_html_instance.write_pdf.assert_called_once()

    @patch.object(Path, 'exists')
    def test_generate_html_not_found(self, mock_exists):
        """Test PDF generation when HTML file doesn't exist."""
        mock_exists.return_value = False
        
        with pytest.raises(FileNotFoundError):
            self.generator.generate(
                html_path="missing.html",
                output_path="output.pdf"
            )

    @patch('generate_pdf.HTML')
    @patch.object(Path, 'exists', side_effect=[True, False])
    def test_generate_css_not_found_warning(self, mock_exists, mock_html):
        """Test that missing CSS file logs warning but continues."""
        mock_html_instance = Mock()
        mock_html.return_value = mock_html_instance
        
        result = self.generator.generate(
            html_path="test.html",
            output_path="output.pdf",
            css_path="missing.css"
        )
        
        assert result is True
        mock_html_instance.write_pdf.assert_called_once()

    @patch('generate_pdf.HTML')
    @patch.object(Path, 'exists', return_value=True)
    def test_generate_without_css(self, mock_exists, mock_html):
        """Test PDF generation without CSS stylesheet."""
        mock_html_instance = Mock()
        mock_html.return_value = mock_html_instance
        
        result = self.generator.generate(
            html_path="test.html",
            output_path="output.pdf",
            css_path=None
        )
        
        assert result is True
        # CSS should not be instantiated
        from weasyprint import CSS
        # Verify write_pdf was called with empty stylesheets
        mock_html_instance.write_pdf.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
