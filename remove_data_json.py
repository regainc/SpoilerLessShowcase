import os

if os.path.exists('data.json'):
    os.remove('data.json')
    print("data.json has been removed.")
else:
    print("data.json does not exist.")
