import './App.css'
import React, { useState, useEffect, useRef } from 'react'
//import GeoJSON from 'ol/format/GeoJSON'
import MapWrapper from './components/MapWrapper'
import { Icon, Style, Fill, Stroke, Circle } from 'ol/style'
import Feature from 'ol/Feature'
import * as proj from 'ol/proj'
import Point from 'ol/geom/Point'
import GeoJSON from 'ol/format/GeoJSON'
function App() {
  // set intial state
  const [features, setFeatures] = useState([])
  const [planes, setPlanes] = useState([])
  const [position, setPosition] = useState([34.82141, 32.08379])

  const reference = useRef()
  reference.current = position

  const reference2 = useRef()
  reference2.current = features

  // initialization - retrieve GeoJSON features from Mock JSON API get features from mock
  //  GeoJson API (read from flat .json file in public directory)
  useEffect(() => {
    const getIconFeature = () => {
      const iconFeature = new Feature({
        geometry: new Point(proj.fromLonLat(reference.current)),
        name: 'Self position Icon',
        id: 101,
      })

      iconFeature.setStyle(getSelfIconStyle(0))
      return iconFeature
    }

    const getPlanes = async () => {
      while (true) {
        fetch('https://globus-hackathon-opensky.herokuapp.com/OpenSky')
          .then((r) => r.json())
          .then((planesLst) => {
            let pp = []
            let ppp = [
              {
                id: 1,
                callSign: 'SWR32R  ',
                longitude: 34.82141,
                latitude: 32.08379,
                altitude: 11574.78,
                trueTrack: 283.03,
                verticalRate: 0,
              },
              {
                id: 2,
                callSign: 'DMS1    ',
                longitude: 34.82141,
                latitude: 32.08379,
                altitude: 3048,
                trueTrack: 243.26,
                verticalRate: 0,
              },
              {
                id: 3,
                callSign: 'MLN235  ',
                longitude: 34.83141,
                latitude: 32.09379,
                altitude: 6812.28,
                trueTrack: 178.74,
                verticalRate: -17.56,
              },
            ]
            planesLst
              .filter(
                (p) =>
                  p.longitude > 30 &&
                  p.longitude < 40 &&
                  p.latitude > 30 &&
                  p.latitude < 36,
              )
              .forEach((plane) => {
                let iconFeature = new Feature({
                  geometry: new Point(
                    proj.fromLonLat([plane.longitude, plane.latitude]),
                  ),
                  name: plane.callSign,
                })

                iconFeature.setStyle(getSelfIconStyle(plane.trueTrack))
                pp.push(iconFeature)
              })

            setPlanes(pp)
          })
        await sleep(2000).then((v) => {})
      }
    }

    const movePlane = async () => {
      while (true) {
        setPosition((reference) => [reference[0], reference[1] + 0.00001])
        setFeatures([getIconFeature()])
        await sleep(33).then((v) => {})
      }
    }

    setFeatures([getIconFeature()])
    setPlanes([])

    movePlane()
    // getPlanes()
  }, [])

  const getSelfIconStyle = (rot) => {
    var pi = Math.PI
    return new Style({
      image: new Icon({
        src: require('./assets/plane.png'),
        rotation: rot * (pi / 180),
      }),
    })
  }

  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  return (
    <div className="App">
      <div className="app-label">
        <p>גלובוס לזיבי</p>
      </div>
      <MapWrapper features={features} planes={planes} />
    </div>
  )
}

export default App
