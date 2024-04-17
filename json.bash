#!/bin/bash

# JSON file
json_file="s.json"  # Replace "your_json_file.json" with your actual JSON file
html_file="games.html"            # Name of the HTML file to be generated

# Read JSON data from file
json_data=$(cat "$json_file")

# Initialize HTML content
html_content="<html><head><title>Games</title></head><body>"

# Loop through each object in the JSON array
while IFS= read -r game_data; do
    # Extract link and image from current game object
    link=$(jq -r '.link' <<< "$game_data")
    image=$(jq -r '.image' <<< "$game_data")
    
    # Construct HTML for current game
    button="<button onclick=\"window.open('$link', '_blank')\"><img src='$image'/></button>"
    
    # Append current game's HTML to overall HTML content
    html_content="$html_content$button"
done <<< "$(echo "$json_data" | jq -c '.[]')"

# Finalize HTML content
html_content="$html_content</body></html>"

# Write HTML content to file
echo "$html_content" > "$html_file"

echo "HTML file '$html_file' has been generated."
