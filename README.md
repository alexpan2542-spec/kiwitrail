# KiwiTrail

KiwiTrail is a full-stack web app for discovering outdoor destinations in New Zealand, including tracks, huts, and campsites from NZ DOC data.

Users can search destinations by region, view trail route information, check elevation profiles calculated from NZ 8m DEM data, open weather forecasts via MetService, and navigate to destinations with Google Maps.

## Live Demo

[Vercel Demo](your-vercel-link)

## Key Features

- Search DOC tracks, huts, and campsites by region
- View outdoor destination details
- Display trail elevation profiles calculated from NZ 8m DEM data
- Link to MetService weather forecasts
- Open Google Maps navigation for each destination
- Responsive React frontend

## Tech Stack

### Frontend
- React
- Vercel

### Backend
- FastAPI
- PostgreSQL
- PostGIS

### Data & Geospatial Processing
- NZ DOC tracks, huts, and campsites open data
- NZ 8m DEM data
- Elevation extraction for trail routes
- Geospatial storage and querying with PostGIS

## Project Highlights

- Built a full-stack geospatial web application using React, FastAPI, PostgreSQL, and PostGIS
- Processed real-world DOC open datasets for tracks, huts, and campsites
- Used NZ 8m DEM data to calculate elevation along trail routes
- Designed region-based search for outdoor destinations
- Integrated external services for weather forecasts and navigation

## What I Learned

- Building APIs with FastAPI
- Managing geospatial data with PostGIS
- Processing DEM raster data for elevation analysis
- Connecting frontend search UI with backend geospatial queries
- Deploying a full-stack application
