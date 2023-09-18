import axios from "axios"

export const getAll = async (isIDIR: boolean) => {
    const url = `${process.env.SAM_API_URL}/GetAll/`
    const response = await axios
        .get(`${url}`, {
            params: {
                isIDIR
            },
            auth: {
                username: `${process.env.SAM_API_USERNAME}`,
                password: `${process.env.SAM_API_PASSWORD}`
            }
        })
        .then(
            (response) =>
                // console.log(response.data.filter((item: any) => item.Application === "WGS"))
                response.data
        )
        .catch((error) => {
            console.log(error)
            return error
        })
    return response
}
