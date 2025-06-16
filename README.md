# GitGenie - The AI-Powered Repository Assistant

GitGenie is a Python-based tool that leverages Llama 3.2 and Langchain to help you understand any GitHub repository. Whether you're a newcomer or an experienced developer, GitGenie answers your questions and provides clear insights into repository structures, code, and documentation.

## How It Works

- **Natural Language Query**: Ask questions in plain English, and GitGenie uses Llama 3.2 and Langchain to analyze and respond with detailed explanations.
- **In-Depth Repository Analysis**: Obtain information on file structures, code snippets, and documentation.
- **Real-Time AI Assistance**: Get instant, contextually aware responses as you explore any GitHub project.

## Features

- **Instant Insights**: Quickly summarize files and code segments.
- **Interactive Learning**: Navigate and understand complex codebases through natural language queries.
- **Enhanced Navigation**: Easily locate key functions, files, and documentation.

## Installation

1. **Clone the Repository**  
    ```bash
    git clone https://github.com/your-username/GitGenie.git
    cd GitGenie
    ```

2. **Set Up Virtual Environment**  
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
    ```

3. **Install Dependencies**  
    Ensure you have Python installed. Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

4. **Configuration**  
    Copy the example configuration to configure GitGenie:
    ```bash
    cp config.example.json config.json
    ```

## Usage

- **Start GitGenie**  
  Run the main script to launch the assistant:
  ```bash
  python gitgenie.py
  ```

- **Ask Questions**  
  Input your natural language queries about any GitHub repository. GitGenie will respond with detailed insights powered by Llama 3.2 and Langchain.

## Contributing

Contributions to GitGenie are welcome. To contribute:

1. Fork the repository.
2. Create a new feature branch:  
    ```bash
    git checkout -b feature/YourFeature
    ```
3. Commit your changes with clear, descriptive messages.
4. Push the branch:  
    ```bash
    git push origin feature/YourFeature
    ```
5. Open a Pull Request.

## License

GitGenie is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For support or to ask questions about GitGenie, please open an issue on [GitHub](https://github.com/your-username/GitGenie/issues).

Happy exploring!
