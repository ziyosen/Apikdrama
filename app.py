from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# URL halaman yang akan di-scrape
URL = 'https://drakorid.co/'

@app.route('/api/terbaru', methods=['GET'])
def get_terbaru():
    try:
        response = requests.get(URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        section = soup.find('div', id='section_terbaru')
        items = section.find_all('div', class_='item')  # Sesuaikan dengan struktur HTML

        data_list = []
        for item in items:
            title_tag = item.find('h3')
            title = title_tag.text if title_tag else 'No Title'
            link_tag = item.find('a')
            link = link_tag['href'] if link_tag else '#'
            img_tag = item.find('img')
            thumbnail = img_tag['src'] if img_tag else ''
            data_list.append({
                'title': title,
                'link': link,
                'thumbnail': thumbnail
            })

        return jsonify(data_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
