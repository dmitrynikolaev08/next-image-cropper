'use client';

import { useRef, useState, ChangeEvent } from 'react';
import JSZip from 'jszip';

type UploadedImage = {
    src: string;
    name: string;
};

export default function Home() {
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        console.log('files', files);
        if (files && files.length > 0) {
            const formData = new FormData();
            const imageFiles = Array.from(files);
            console.log('imageFiles', imageFiles);
            imageFiles.forEach((image) => {
                formData.append('image', image);
            });

            formData.forEach((value, key) => {
                console.log('key', key);
                console.log('value', value);
            });

            const res = await fetch('/api/crop-images', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const croppedImages = data.croppedImages.map((image: any) => ({
                    src: URL.createObjectURL(
                        new Blob([new Uint8Array(image.buffer.data)], {
                            type: 'image/png',
                        })
                    ),
                    name: image.name,
                }));
                setUploadedImages(croppedImages);
            } else {
                setError('Error cropping images');
            }
        }
    };

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        const imageFolder = zip.folder('images');

        await Promise.all(
            uploadedImages.map(async (image) => {
                const response = await fetch(image.src);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                imageFolder!.file(`${image.name}.png`, arrayBuffer);
            })
        );

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'images.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const renderImages = () => {
        return uploadedImages.map((image, index) => (
            <div key={index} className="m-4">
                <img
                    src={image.src}
                    alt={image.name}
                    className="h-auto w-auto"
                />
            </div>
        ));
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
            <h1 className="mb-6 text-4xl font-bold">Image Cropper</h1>
            <button
                type="button"
                onClick={triggerFileInput}
                className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300"
            >
                Upload Images
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
            />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex flex-wrap justify-center">
                {renderImages()}
            </div>
            <button
                type="button"
                onClick={handleDownloadAll}
                className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition duration-300"
            >
                Download All Images
            </button>
        </main>
    );
}
