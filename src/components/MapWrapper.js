// react
import React, { useState, useEffect, useRef } from 'react'

// openlayers
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { fromLonLat, get } from 'ol/proj'
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

  // pull refs
  const mapElement = useRef()

  // create state ref that can be accessed in OpenLayers onclick callback function
  //  https://stackoverflow.com/a/60643670
  const mapRef = useRef()
  mapRef.current = map

  // initialize map on first render - logic formerly put into componentDidMount
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
        center: fromLonLat([34.82141, 32.08374]),
        zoom: 10,
      }),
      controls: [],
    })

    // set map onclick handler
    initialMap.on('pointermove', handleMapClick)

    fetch('/entities.json')
      .then((response) => response.json())
      .then((fetchedFeatures) => {
        // parse fetched geojson into OpenLayers features
        //  use options to convert feature from EPSG:4326 to EPSG:3857

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
          features: props.features, // make sure features is an array
        }),
      )

      if (fitPlane) {
        map.getView().setCenter(props.features[0].getGeometry().getExtent())
      }
    }

    if (props.planes.length) {
      // console.log(props.planes)
      planesLayer.setSource(
        new VectorSource({
          features: props.planes, // make sure features is an array
        }),
      )
    }
  }, [props.features, props.planes])
  // return/render logic eliminated for brevity

  // update map if features prop changes - logic formerly put into componentDidUpdate
  // useEffect(() => {
  //   if (props.features.length) {
  //     // may be null on first render
  //     // set features to map
  //     featuresLayer.setSource(
  //       new VectorSource({
  //         features: props.features, // make sure features is an array
  //       }),
  //     )
  //   }
  // }, [props.features, featuresLayer])

  // map click handler
  const handleMapClick = (event) => {
    // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
    //  https://stackoverflow.com/a/60643670
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel)

    // transform coord to EPSG 4326 standard Lat Long
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

    // set React state
    setSelectedCoord(transormedCoord)
  }

  const handleClick = (event) => {
    // 👇️ refers to the image element
    console.log(event.target)

    console.log('Image clicked')
  }

  // render component
  return (
    <div>
      <div ref={mapElement} className="map-container"></div>
      <div className="clicked-coord-label">
        <p>{selectedCoord ? toStringXY(selectedCoord, 5) : ''}</p>
      </div>
      <img
        style={centerIconStyle}
        src={require('../assets/center.ico')}
        onClick={() => setFitPlane(true)}
      />
    </div>
  )
}

var centerIconStyle = {
  width: '50px',
  position: 'absolute',
  bottom: 3,
  left: 3,
}

export default MapWrapper
