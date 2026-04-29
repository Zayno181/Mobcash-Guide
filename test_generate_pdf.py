"""Unit tests for PDF Generator module."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock, call
from generate_pdf import PDFGenerator, LoggingConfig


class TestLoggingConfig:
    """Test cases for LoggingConfig class."""
    
    def test_setup_info_level(self, caplog):
        """Test logging setup with INFO level."""
        logger = LoggingConfig.setup(verbose=False)
        assert logger is not None
        
    def test_setup_debug_level(self, caplog):
        """Test logging setup with DEBUG level."""
        logger = LoggingConfig.setup(verbose=True)
        assert logger is not None


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
        mock_css.assert_called_once()

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
    def test_generate_css_not_found_warning(self, mock_exists, mock_html, caplog):
        """Test that missing CSS file logs warning but continues."""
        mock_html_instance = Mock()
        mock_html.return_value = mock_html_instance
        
        result = self.generator.generate(
            html_path="test.html",
            output_path="output.pdf",
            css_path="missing.css"
        )
        
        assert result is True
        assert "CSS file not found" in caplog.text
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
        # Verify write_pdf was called with empty stylesheets list
        mock_html_instance.write_pdf.assert_called_once()
        call_args = mock_html_instance.write_pdf.call_args
        assert call_args[1]['stylesheets'] == []

    @patch('generate_pdf.HTML')
    @patch('generate_pdf.CSS')
    @patch.object(Path, 'exists', return_value=True)
    def test_load_stylesheets_returns_list(self, mock_exists, mock_css, mock_html):
        """Test that _load_stylesheets returns a list."""
        mock_css_instance = Mock()
        mock_css.return_value = mock_css_instance
        
        result = self.generator._load_stylesheets("styles.css")
        
        assert isinstance(result, list)
        assert len(result) == 1

    def test_load_stylesheets_no_css_path(self):
        """Test _load_stylesheets with None path."""
        result = self.generator._load_stylesheets(None)
        assert result == []
        
    def test_load_stylesheets_empty_string(self):
        """Test _load_stylesheets with empty string."""
        result = self.generator._load_stylesheets("")
        assert result == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
