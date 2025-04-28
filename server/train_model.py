import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle

def train_model():
    # Load dataset (you can use your own dataset or download from Kaggle)
    # Example: https://www.kaggle.com/clmentbisaillon/fake-and-real-news-dataset
    
    # Load true news
    true_df = pd.read_csv('data/True.csv')
    true_df['label'] = 1

    # Load fake news
    fake_df = pd.read_csv('data/Fake.csv')
    fake_df['label'] = 0

    # Combine datasets
    df = pd.concat([true_df, fake_df]).reset_index(drop=True)
    
    # Create features and labels
    X = df['text']  # Your news text column
    y = df['label']

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create and fit TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X_train_vectorized = vectorizer.fit_transform(X_train)
    X_test_vectorized = vectorizer.transform(X_test)

    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_vectorized, y_train)

    # Make predictions and print metrics
    y_pred = model.predict(X_test_vectorized)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save the model and vectorizer
    pickle.dump(model, open('model/fake_news_model.pkl', 'wb'))
    pickle.dump(vectorizer, open('model/vectorizer.pkl', 'wb'))

if __name__ == "__main__":
    train_model() 