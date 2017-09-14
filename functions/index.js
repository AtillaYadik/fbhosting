const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;

exports.generateThumbnail = functions.storage.object()
    .onChange(event => {
        const object = event.data;
        const filePath = object.name;
        const fileName = filePath.split('/').pop();
        const fileBucket = object.bucket;
        const bucket = gcs.bucket(fileBucket);
        const tempFilePath = `/tmp/${fileName}`;

        console.log("object ----", object);
        console.log("filePath ----", filePath);
        console.log("fileName -----", fileName);
        console.log("fileBucket -----", fileBucket);
        console.log("bucket ----", bucket);
        console.log('tempFilePath ------', tempFilePath);

        if (fileName.startsWith('thumb_')) {
            console.log('Already added')
            return
        }

        if (!object.contentType.startsWith('image/')) {
            console.log('This is not an image.')
            return
        }

        if (object.resourceState === 'not_exists') {
            console.log('This is a deletion event');
            return
        }

        return bucket.file(filePath).download({
            destination:tempFilePath
        })
        .then(() => {
            console.log('Image downloaded locally to', tempFilePath)
            return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath])
        })
        .then(() => {
            console.log("Thumbnail created")
            const thumbFilePath = filePath.replace(/(\/)?([^\/]*)$/,
                    '$1thumb_$2')
            
            console.log("thumbFilePath -----------------", thumbFilePath);
            return bucket.upload(tempFilePath, {
                destination:thumbFilePath
            })

        })
    })
