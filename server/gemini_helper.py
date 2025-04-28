import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from google.oauth2 import service_account

# Load environment variables
load_dotenv()

# Configure the Gemini API - choose either API key OR credentials, not both
api_key = os.getenv('GEMINI_API_KEY')
credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

if api_key:
    # Use API key authentication
    genai.configure(api_key=api_key)
else:
    # Use service account authentication
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    genai.configure(credentials=credentials)

def analyze_content_with_gemini(text, prompt_type="verify"):
    """
    Analyze content using Google's Gemini API
    
    Args:
        text (str): The news text to analyze
        prompt_type (str): Type of analysis - "verify" or "classify"
        
    Returns:
        dict: Analysis results
    """
    try:
        # Get the appropriate Gemini model
        if prompt_type == "verify":
            # Use the more accurate experimental model for verification tasks
            model = genai.GenerativeModel('gemini-2.5-pro-preview-03-25')
            # model = genai.GenerativeModel('gemini-1.5-pro')
        else:
            # Use standard model for other tasks
            model = genai.GenerativeModel('gemini-1.5-pro')
        
        if prompt_type == "verify":
            prompt = f"""
            Task: Carefully analyze the following statement and determine if it is REAL or FAKE news.

            STATEMENT TO VERIFY: "{text}"

            Analysis Instructions:
            - Evaluate the entire statement as a single claim
            - Determine if the news/claim is REAL or FAKE
            - Provide specific evidence supporting your assessment
            - List at least 2 specific, reliable sources that verify or contradict the claim (include names of publications, research papers, or official sources)
            - Include direct URLs to sources where possible

            Please format your response as a JSON object with this structure:
            {{
              "verdict": string, // "REAL" or "FAKE"
              "confidence": float, // 0.0 to 1.0
              "evidence": string, // Explanation of your assessment
              "truth_score": float, // 0.0 (completely false) to 1.0 (completely true)
              "sources": [
                {{
                  "name": string, // Name of publication or organization
                  "url": string // Direct link to source
                }}
              ]
            }}

            Additional guidelines:
            - Express the verdict clearly as either "REAL" or "FAKE"
            - Truth score should be from 0.0 (completely false) to 1.0 (completely true)
            - Provide clear, concise evidence for your assessment
            - Ensure sources are credible (academic, major news outlets, government agencies, etc.)
            - Express confidence level based on quality/quantity of available sources

            Your response must ONLY contain the JSON object with no other text.
            """
        elif prompt_type == "classify":
            prompt = f"""
            You are a news classification expert. Analyze this news text and classify it according to:
            
            1. Topic category (politics, business, technology, health, etc.)
            2. Emotional tone (neutral, inflammatory, sensationalist, balanced)
            3. Information depth (superficial, detailed, in-depth)
            4. Verifiable facts vs opinions ratio
            
            Format your response as a JSON object with the following keys:
            - category: primary news category
            - subcategory: more specific category
            - tone: emotional tone assessment
            - info_depth: depth of information
            - fact_opinion_ratio: ratio as a number 0.0-1.0 (higher means more factual)
            - key_topics: list of main topics/keywords
            
            News text: {text}
            """
        else:
            prompt = f"""
            Analyze this news text and provide a general assessment in JSON format:
            {text}
            """
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Extract and parse JSON from response
        try:
            response_text = response.text
            # Find JSON object in the text if it's wrapped in markdown or other text
            import re
            json_match = re.search(r'```json\n(.*?)```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find a JSON object anywhere in the text
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = response_text
                    
            analysis_results = json.loads(json_str)
            return analysis_results
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw text
            return {
                "error": "Failed to parse JSON response",
                "raw_response": response.text,
                "score": 0.5,
                "confidence": 0.3
            }
            
    except Exception as e:
        print(f"Error analyzing with Gemini: {str(e)}")
        return {
            "error": str(e),
            "score": 0.5,
            "confidence": 0.3
        } 