import audioBufferToWav from 'audiobuffer-to-wav'
import { curry } from 'ramda'
import JSZip from  'jszip'
import { saveAs } from 'file-saver';

const downloadZip = (a, fileName, audioBuffers, instruments) => {
    
    const wavArray = []
    // Buffer to wav
    audioBuffers.forEach(audioBuffer => wavArray.push(audioBufferToWav(audioBuffer)))

    const zip = zipFiles(wavArray, instruments)

    zip.generateAsync({type: "blob"})
        .then(blob => saveAs(blob, fileName))
        .catch(e => console.log(e));
}

const downloadURL = curry((a, fileName, url) => {
    a.href = url
    a.download = fileName
    a.click()
    a.parentNode.removeChild(a)
})

const downloadFile = {
    zip: downloadZip,
    mid: downloadURL,
}

const zipFiles = (filesArray, instruments) => {
    var zip = new JSZip();
    for (let i = 0; i < filesArray.length; i++) {
        zip.file((i + 1) + ".wav", filesArray[i]);
    }

    return zip
}

const saveAsFile = curry((fileType, fileName, fileContents, instruments = []) => {
    const a = document.createElement('a')
    a.style.display = 'none'
    document.body.appendChild(a)
    const downloadFn = downloadFile[fileType]
    downloadFn(a, `${fileName}.${fileType}`, fileContents, instruments)
})

export {
    saveAsFile,
}
