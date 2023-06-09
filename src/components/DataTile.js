import React, { useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {db} from '../firebase';
import { doc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { UserContext } from '../pages/Dashboard';

export default function DataTile({className, apiReadKey, channelId}) {
    const [data, setData] = useState({});
    const units = ["Lx", "°C", "%"];
    var fieldData = "";
    var fieldUnit = "";
    var tileName = "";
    var fetchTimeInterval = 1000;
    const user = useContext(UserContext);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds/last.json?api_key=${apiReadKey}`);
            const data = await response.json();
            setData(data);
        };

        const timer = setInterval(fetchData, fetchTimeInterval);

        return () => {
            clearInterval(timer);
        }
    }, []);

    async function addToRepairLogs(email, timestamp) {
        const RepairData = {
            Email: email,
            TimeStamp: timestamp,
            id: uuidv4(),
            task: "Tagged latest issue as repaired",
        }

        try {
            const collectionRef = collection(db, 'repair-logs');
            const logInDataRef = doc(collectionRef, RepairData.id);
            await setDoc(logInDataRef, RepairData);
        } catch (err) {
            console.log(err.message);
        }
    }

    const resetMotion = async (e) => {
        e.preventDefault();
        const url = "https://api.thingspeak.com/update?api_key=OA1I757ZN0AAOW7U&field1=0";
        const response = await fetch(url);
        const data = await response.json();
        addToRepairLogs(user.email, serverTimestamp());        
    }

    if (className === 'illuminance-container') {
        fieldData = data.field1;
        fieldUnit = units[0];
        tileName = "Illuminance";
    }

    else if (className === 'motion-container') {
        tileName = "Gyroscope and Accelerometer";
        if (data.field1 == 1) {
            fieldData = "Motion is Detected!"
        }
        else {
            fieldData = "Equipment is safe";
        }
    }

    else if (className === 'temp-container') {
        fieldData = data ? Number(data.field1) : 0.0;
        fieldData = fieldData.toFixed(2);
        fieldUnit = units[1];
        tileName = "Temperature";
    }

    else if (className === 'humid-container') {
        fieldData = data ? Number(data.field2) : 0.0;
        fieldData = fieldData.toFixed(2);
        fieldUnit = units[2];
        tileName = "Humidity";
    }

    if (className === 'motion-container') {
        return (
            <div className = {className}>
                <h2>{tileName}</h2>
                <div className='tile-data-container'>
                    <p className='fieldData'>{fieldData}</p>
                    <p className='fieldUnit'>{fieldUnit}</p>
                    {(data.field1 == 1) && <button onClick={resetMotion}>REPAIRED</button>}
                </div>
            </div>
        )
    }

    else {
        return (
            <div className = {className}>
                <h2 className='tileName'>{tileName}</h2>
                <div className='tile-data-container'>
                    <p className='fieldData'>{fieldData}</p>
                    <p className='fieldUnit'>{fieldUnit}</p>
                </div>
                <p className='time-stamp'>Last entry: {data.created_at}</p>
            </div>
        )
    }
    
}
