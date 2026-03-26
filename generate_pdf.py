
from weasyprint import HTML, CSS
import os

def generate_pdf(html_path, output_path, css_path=None):
    try:
        # Ensure the HTML file exists
        if not os.path.exists(html_path):
            print(f"Error: HTML file not found at {html_path}")
            return

        # Create an HTML object from the file
        html = HTML(filename=html_path)

        # If a CSS path is provided, load it
        stylesheets = []
        if css_path and os.path.exists(css_path):
            stylesheets.append(CSS(filename=css_path))
        elif css_path:
            print(f"Warning: CSS file not found at {css_path}. Proceeding without it.")

        # Generate PDF
        html.write_pdf(output_path, stylesheets=stylesheets)
        print(f"PDF generated successfully at {output_path}")
    except Exception as e:
        print(f"An error occurred during PDF generation: {e}")

if __name__ == "__main__":
    # Define paths relative to the script location
    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(base_dir, "_site", "index.html")
    output_pdf = os.path.join(base_dir, "Mobcash_Guide.pdf")
    css_file = os.path.join(base_dir, "styles.css")

    generate_pdf(html_file, output_pdf, css_file)
