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
  let resolveSend = null;
  let isTransferComplete = false;

  // 16 KB is the safest chunk size across all browsers to prevent SCTP message size aborts
  const CHUNK_SIZE = 16 * 1024;

  const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ],
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
          isTransferComplete = true;
          // Send ACK back so sender knows we got it
          dataChannel.send("ACK");
          // Wait briefly to ensure the ACK is actually sent over the network 
          // before the UI receives 'onComplete' and immediately calls dispose()
          setTimeout(() => {
            const blob = new Blob(receiveBuffer, {
              type: fileMeta?.type || "application/octet-stream",
            });
            receiveBuffer = [];
            receivedSize = 0;
            onComplete(blob, fileMeta);
          }, 500);
        } else if (event.data === "ACK") {
          if (resolveSend) {
            resolveSend();
            resolveSend = null;
          }
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
      if (isTransferComplete) return; // Suppress error if already complete
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
        const checkState = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", checkState);
            clearTimeout(timeout);
            resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
          }
        };
        peerConnection.addEventListener("icegatheringstatechange", checkState);
        const timeout = setTimeout(() => {
          peerConnection.removeEventListener("icegatheringstatechange", checkState);
          resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
        }, 1500);
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
        const checkState = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", checkState);
            clearTimeout(timeout);
            resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
          }
        };
        peerConnection.addEventListener("icegatheringstatechange", checkState);
        const timeout = setTimeout(() => {
          peerConnection.removeEventListener("icegatheringstatechange", checkState);
          resolve({ type: peerConnection.localDescription.type, sdp: peerConnection.localDescription.sdp });
        }, 1500);
      }
    });
  };

  /**
   * Called by Sender to send the file.
   * Call this only AFTER DataChannel is open.
   */
  const sendFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!dataChannel) {
        return reject(new Error("DataChannel does not exist"));
      }

      const startSending = () => {
        let offset = 0;
        const reader = new FileReader();

        const readSlice = (o) => {
          const slice = file.slice(offset, o + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
          if (dataChannel.readyState !== "open") {
            return reject(new Error("DataChannel closed during transfer"));
          }
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
            resolveSend = resolve;
          }
        };

        reader.onerror = () => reject(reader.error);

        dataChannel.bufferedAmountLowThreshold = 512 * 1024; // 512 KB
        readSlice(0);
      };

      if (dataChannel.readyState === "open") {
        startSending();
      } else {
        const handleOpen = () => {
          if (dataChannel) {
             dataChannel.removeEventListener("open", handleOpen);
          }
          startSending();
        };
        const handleFail = () => {
          if (dataChannel) {
             dataChannel.removeEventListener("open", handleOpen);
             dataChannel.removeEventListener("close", handleFail);
             dataChannel.removeEventListener("error", handleFail);
          }
          reject(new Error("DataChannel closed unexpectedly before transfer completed"));
        };
        dataChannel.addEventListener("open", handleOpen);
        dataChannel.addEventListener("close", handleFail);
        dataChannel.addEventListener("error", handleFail);
      }
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
