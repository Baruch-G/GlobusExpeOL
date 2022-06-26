import React, { useState, useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { transform } from 'ol/proj'
import GeoJSON from 'ol/format/GeoJSON'
import { toStringXY } from 'ol/coordinate'

function MapWrapper(props) {
  const [map, setMap] = useState()
  const [featuresLayer, setFeaturesLayer] = useState()
  const [selectedCoord, setSelectedCoord] = useState()
  const [fitPlane, setFitPlane] = useState(true)
  const [planesLayer, setPlanesLayer] = useState()

  const mapElement = useRef()
  const mapRef = useRef()
  mapRef.current = map

  useEffect(() => {
    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        // USGS Topo
        new TileLayer({
          source: new XYZ({
            projection: 'EPSG:3857',
            url: 'http://localhost:3650/api/maps/israel_1/{z}/{x}/{y}.png',
            crossOrigin: '',
          }),
        }),
      ],
      view: new View({
        projection: 'EPSG:3857',
        zoom: 10,
      }),
      controls: [],
    })
    initialMap.on('pointermove', handleMapClick)

    fetch('/entities.json')
      .then((response) => response.json())
      .then((fetchedFeatures) => {
        const wktOptions = {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        }
        const parsedFeatures = new GeoJSON().readFeatures(
          fetchedFeatures,
          wktOptions,
        )
        var infraVectorLayer = new VectorLayer({
          source: new VectorSource({ features: parsedFeatures }),
        })
        initialMap.addLayer(infraVectorLayer)
      })

    var vectorLayer = new VectorLayer({
      source: new VectorSource(),
    })

    var planesVectorLayer = new VectorLayer({
      source: new VectorSource(),
    })

    initialMap.on('pointerdrag', () => setFitPlane(false))
    initialMap.getView().on('change:resolution', () => setFitPlane(false))

    initialMap.addLayer(vectorLayer)
    initialMap.addLayer(planesVectorLayer)
    setMap(initialMap)
    setFeaturesLayer(vectorLayer)
    setPlanesLayer(planesVectorLayer)
  }, [])

  useEffect(() => {
    if (props.features.length) {
      featuresLayer.setSource(
        new VectorSource({
          features: props.features,
        }),
      )

      if (fitPlane) {
        map.getView().setCenter(props.features[0].getGeometry().getExtent())
      }
    }

    if (props.planes.length) {
      planesLayer.setSource(
        new VectorSource({
          features: props.planes,
        }),
      )
    }
  }, [props.features, props.planes])
  const handleMapClick = (event) => {
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel)
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')
    setSelectedCoord(transormedCoord)
  }

  return (
    <div>
      <div ref={mapElement} className="map-container"></div>
      <div className="clicked-coord-label">
        <p>{selectedCoord ? toStringXY(selectedCoord, 5) : ''}</p>
      </div>
      <img
        style={centerIconStyle(fitPlane ? 0.1 : 1)}
        src={require('../assets/center.ico')}
        onClick={() => setFitPlane(true)}
      />
    </div>
  )
}

const centerIconStyle = (opa) => {
  let style = {
    width: '50px',
    position: 'absolute',
    bottom: 3,
    left: 3,
    opacity: opa
  }
  return style
}

export default MapWrapper
