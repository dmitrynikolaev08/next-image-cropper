'use client';

import Image from 'next/image';
import { useRef, useState, ChangeEvent } from 'react';

type UploadedImage = {
    src: string;
    name: string;
};

/* eslint-disable */

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

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const renderImages = () => {
        return uploadedImages.map((image, index) => (
            <div key={index} className="m-4">
                <Image
                    src={image.src}
                    alt={`Uploaded image ${image.name}`}
                    width={200}
                    height={200}
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
        </main>
    );
}
