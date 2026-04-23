// ---------------------------------------------------------------------------
// WebRTC Service — P2P Large File Transfer
// ---------------------------------------------------------------------------
// Handles WebRTC connection, DataChannel setup, and chunked file transfer
// using Vanilla ICE (waiting for all candidates before sending SDP).
// ---------------------------------------------------------------------------

export const createWebRTCService = (onProgress, onComplete, onError) => {
  let peerConnection = null;
  let dataChannel = null;
  let receiveBuffer = [];
  let receivedSize = 0;
  let fileMeta = null;

  const CHUNK_SIZE = 64 * 1024; // 64 KB

  const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE Connection State:", peerConnection.iceConnectionState);
      if (
        peerConnection.iceConnectionState === "failed" ||
        peerConnection.iceConnectionState === "disconnected"
      ) {
        onError(new Error("WebRTC connection failed or disconnected."));
      }
    };
  };

  const setupDataChannel = (dc) => {
    dataChannel = dc;
    dataChannel.binaryType = "arraybuffer";

    dataChannel.onopen = () => {
      console.log("[WebRTC] DataChannel open");
    };

    dataChannel.onmessage = (event) => {
      if (typeof event.data === "string") {
        if (event.data === "EOF") {
          // File transfer complete
          const blob = new Blob(receiveBuffer, {
            type: fileMeta?.type || "application/octet-stream",
          });
          receiveBuffer = [];
          receivedSize = 0;
          onComplete(blob, fileMeta);
        }
      } else {
        // Receiving binary chunk
        receiveBuffer.push(event.data);
        receivedSize += event.data.byteLength;
        if (fileMeta && fileMeta.size) {
          onProgress(receivedSize / fileMeta.size);
        }
      }
    };

    dataChannel.onerror = (error) => {
      console.error("[WebRTC] DataChannel error:", error);
      onError(new Error("DataChannel error occurred."));
    };
    
    dataChannel.onclose = () => {
      console.log("[WebRTC] DataChannel closed");
    }
  };

  /**
   * Called by Sender to initiate WebRTC.
   * Returns a Promise resolving to the full SDP Offer (including ICE candidates).
   */
  const createOffer = async (meta) => {
    createPeerConnection();
    fileMeta = meta;
    const dc = peerConnection.createDataChannel("fileTransfer");
    setupDataChannel(dc);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return new Promise((resolve) => {
      if (peerConnection.iceGatheringState === "complete") {
        resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
      } else {
        peerConnection.onicegatheringstatechange = () => {
          if (peerConnection.iceGatheringState === "complete") {
            resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
          }
        };
      }
    });
  };

  /**
   * Called by Sender when Answer is received from Receiver.
   */
  const setAnswer = async (answer) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  /**
   * Called by Receiver to handle an incoming Offer.
   * Returns a Promise resolving to the full SDP Answer.
   */
  const handleOffer = async (offer, meta) => {
    createPeerConnection();
    fileMeta = meta;

    peerConnection.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return new Promise((resolve) => {
      if (peerConnection.iceGatheringState === "complete") {
        resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
      } else {
        peerConnection.onicegatheringstatechange = () => {
          if (peerConnection.iceGatheringState === "complete") {
            resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
          }
        };
      }
    });
  };

  /**
   * Called by Sender to send the file.
   * Call this only AFTER DataChannel is open.
   */
  const sendFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!dataChannel || dataChannel.readyState !== "open") {
        return reject(new Error("DataChannel not open"));
      }

      let offset = 0;
      const reader = new FileReader();

      const readSlice = (o) => {
        const slice = file.slice(offset, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
      };

      reader.onload = (e) => {
        dataChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        onProgress(offset / file.size);

        if (offset < file.size) {
          // Respect buffer limits to avoid memory bloat/crashes
          if (dataChannel.bufferedAmount > 1024 * 1024) { // 1MB threshold
            dataChannel.onbufferedamountlow = () => {
              dataChannel.onbufferedamountlow = null;
              readSlice(offset);
            };
          } else {
            readSlice(offset);
          }
        } else {
          dataChannel.send("EOF");
          resolve();
        }
      };

      reader.onerror = () => reject(reader.error);

      dataChannel.bufferedAmountLowThreshold = 512 * 1024; // 512 KB
      readSlice(0);
    });
  };

  const dispose = () => {
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    receiveBuffer = [];
    receivedSize = 0;
  };

  return Object.freeze({
    createOffer,
    setAnswer,
    handleOffer,
    sendFile,
    dispose,
  });
};
