import React, { Component } from 'react';
import io from 'socket.io-client';
import Room from './Room';

class App extends Component {
  constructor(props) {
    super(props);

    this.localVideoref = React.createRef();
    this.remoteVideoref = React.createRef();
    
    this.socket = null;
    this.candidates = [];
    this.roomID = ''; // To keep track of the room ID
  }

  componentDidMount = () => {
    this.socket = io('/webrtcPeer', {
      path: '/WEBRTC-1',
      query: {}
    });

    this.socket.on('connection-success', success => {
      console.log(success);
    });

    this.socket.on('offerOrAnswer', sdp => {
      if (this.textref) {
        this.textref.value = JSON.stringify(sdp);
      }
    });

    this.socket.on('candidate', candidate => {
      this.candidates = [...this.candidates, candidate];
    });

    const pc_config = null;

    this.pc = new RTCPeerConnection(pc_config);

    this.pc.onicecandidate = e => {
      if (e.candidate) {
        this.sendToPeer('candidate', e.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = e => {
      console.log('ICE connection state change:', e);
    };

    this.pc.ontrack = e => {
      console.log('ontrack event:', e);
      if (this.remoteVideoref.current) {
        this.remoteVideoref.current.srcObject = e.streams[0];
      }
    };

    const success = stream => {
      window.localStream = stream;
      if (this.localVideoref.current) {
        this.localVideoref.current.srcObject = stream;
      }

      stream.getTracks().forEach(track => {
        this.pc.addTrack(track, stream);
      });
    };

    const failure = e => {
      console.log('getUserMedia Error: ', e);
    };

    const constraints = {
      audio: false,
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(success)
      .catch(failure);
  };

  sendToPeer = (messageType, payload) => {
    if (this.socket && this.roomID) {
      this.socket.emit(messageType, {
        roomID: this.roomID,
        socketID: this.socket.id,
        payload
      });
    }
  };

  createOffers = () => {
    console.log('Creating Offer');

    this.pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        this.pc.setLocalDescription(sdp);
        this.sendToPeer('offerOrAnswer', sdp);
      })
      .then(() => {
        console.log('Local description set');
      })
      .catch(error => {
        console.error('Error creating offer:', error);
      });
  };

  createAnswer = () => {
    console.log('Creating Answer');

    this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        this.pc.setLocalDescription(sdp);
        this.sendToPeer('offerOrAnswer', sdp);
      })
      .then(() => {
        console.log('Local description set');
      })
      .catch(error => {
        console.error('Error creating answer:', error);
      });
  };

  setRemoteDescription = () => {
    try {
      const desc = JSON.parse(this.textref.value);
      this.pc.setRemoteDescription(new RTCSessionDescription(desc));
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  addCandidate = () => {
    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate));
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(error => console.error('Error adding ICE candidate:', error));
    });
  };

  joinRoom = (roomID) => {
    this.roomID = roomID;
    this.socket.emit('joinRoom', { roomID });
  };

  render() {
    return (

      

      <div>
        {/* <Room/> */}
        <video
          style={{
            width: 240,
            height: 240,
            margin: 5,
            transform: 'scaleX(-1)',
            backgroundColor: 'black',
          }}
          ref={this.localVideoref}
          autoPlay
        ></video>
        <video
          style={{
            width: 240,
            height: 240,
            margin: 5,
            transform: 'scaleX(-1)',
            backgroundColor: 'black',
          }}
          ref={this.remoteVideoref}
          autoPlay
        ></video>
        <br />
        <button onClick={this.createOffers}>Offer</button>
        <button onClick={this.createAnswer}>Answer</button>
        <br />
        <textarea ref={ref => { this.textref = ref }} />
        <br />
        <button onClick={this.setRemoteDescription}>Set Remote Desc</button>
        <button onClick={this.addCandidate}>Add Candidate</button>
        <br />
        <input
          type="text"
          placeholder="Enter Room ID"
          onChange={(e) => this.joinRoom(e.target.value)}
        />
      </div>
    );
  }
}

export default App;
